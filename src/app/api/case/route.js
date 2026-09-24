import { NextResponse } from 'next/server';
import connectToDatabase from '../../lib/mongodb';
import UserCases from '../../models/userCases';
import User from '../../models/UserInformation';
import { Types } from 'mongoose';
import { verifyToken } from '../../lib/verifyToken';
import { generateCaseNumber } from '../../lib/generateCaseNumber';


/**
 * Stages that fill in the properties a case submitted but holds no rows for.
 *
 * A property row is written while the claimant is still choosing properties,
 * so it is filed under whatever identity the search created and is stamped
 * with the first case that picks it up. Two ordinary things therefore leave a
 * case with no rows of its own: opening it under a different identity, which
 * is what "use a different email" does, and re-filing a property an earlier
 * case already holds. The case still records exactly which properties it
 * covers, but the dashboard read it as $0 with an empty asset list.
 *
 * Only the property_ids with nothing attached are filled in, so a property is
 * never listed twice, and the claimant's own row is always preferred. A row
 * borrowed from another claimant describes the same state property, so its
 * amount and title are right, but the claim number on it belongs to their
 * claim and is dropped rather than shown against this one.
 */
const RECOVER_CASE_PROPERTY_STAGES = [
  {
    $lookup: {
      from: 'userproperties',
      let: {
        userId: '$user_id',
        propertyIds: { $ifNull: ['$property_ids', []] },
      },
      pipeline: [
        { $match: { $expr: { $in: ['$property_id', '$$propertyIds'] } } },
        {
          $addFields: {
            own_row: { $cond: [{ $eq: ['$user_id', '$$userId'] }, 1, 0] },
          },
        },
        // One row per property: the claimant's own if there is one, and the
        // most recent of whatever is left otherwise.
        { $sort: { own_row: -1, createdAt: -1 } },
        { $group: { _id: '$property_id', row: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$row' } },
        {
          $addFields: {
            claim_id: { $cond: [{ $eq: ['$own_row', 1] }, '$claim_id', null] },
          },
        },
      ],
      as: 'recovered_properties',
    },
  },
  {
    $addFields: {
      user_properties: {
        $let: {
          vars: {
            attached: {
              $map: {
                input: '$user_properties',
                as: 'p',
                in: '$$p.property_id',
              },
            },
          },
          in: {
            $concatArrays: [
              '$user_properties',
              {
                $filter: {
                  input: '$recovered_properties',
                  as: 'p',
                  cond: { $not: [{ $in: ['$$p.property_id', '$$attached'] }] },
                },
              },
            ],
          },
        },
      },
    },
  },
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, property_ids } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 },
      );
    }

    const normalizedPropertyIds = Array.isArray(property_ids)
      ? property_ids.map(String).filter(Boolean)
      : [];

    await connectToDatabase();
    const userExists = await User.findById(user_id);
    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found with provided user_id' },
        { status: 404 },
      );
    }

    // A claimant can now have several cases, so resolve the most recent one.
    const existingCase = await UserCases.findOne({ user_id }).sort({
      createdAt: -1,
    });
    if (existingCase) {
      if (normalizedPropertyIds.length > 0) {
        const updatedCase = await UserCases.findOneAndUpdate(
          { _id: existingCase._id },
          { $set: { property_ids: normalizedPropertyIds } },
          { new: true },
        );
        return NextResponse.json(updatedCase, { status: 200 });
      }

      return NextResponse.json(existingCase, { status: 200 });
    }

    const case_id = await generateCaseNumber();

    const newCase = await UserCases.create({
      user_id,
      case_id,
      status: true,
      ...(normalizedPropertyIds.length > 0 && {
        property_ids: normalizedPropertyIds,
      }),
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error('POST /api/userCases error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const case_id = searchParams.get('case_id');
    const claim_id = searchParams.get('claim_id');
    const search = searchParams.get('search');
    const my_user_id = searchParams.get('user_id');
    const public_search = searchParams.get('public');

    // 🔹 CHECK PUBLIC SEARCH FIRST - BEFORE AUTHENTICATION
    //
    // Claimants track by their Case ID (CM-YYYY-NNNNNN), which is issued as
    // soon as the case exists; the state's Claim ID arrives later and is not
    // something they have to hand. Claim ID is still accepted so older links
    // keep working.
    const public_case_number = searchParams.get('case_number');

    if (public_search === 'true' && (claim_id || public_case_number)) {
      await connectToDatabase();

      const pipeline = [];

      if (public_case_number) {
        // Exact match, case-insensitive, with the input escaped so a typed
        // regex character cannot alter the query.
        const escaped = String(public_case_number)
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pipeline.push({
          $match: { case_id: { $regex: `^${escaped}$`, $options: 'i' } },
        });
      } else {
        pipeline.push({
          $match: { claim_id: claim_id }
        });
      }

      // Join related collections
      pipeline.push(
        {
          $lookup: {
            from: 'userinformations',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info',
          },
        },
        { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'userdetails',
            let: { caseId: '$_id', userId: '$user_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$case_id', '$$caseId'] },
                      {
                        $and: [
                          { $eq: [{ $ifNull: ['$case_id', null] }, null] },
                          { $eq: ['$user_id', '$$userId'] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'user_details',
          },
        },
        {
          $lookup: {
            from: 'userdocs',
            let: { caseId: '$_id', userId: '$user_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$case_id', '$$caseId'] },
                      {
                        $and: [
                          { $eq: [{ $ifNull: ['$case_id', null] }, null] },
                          { $eq: ['$user_id', '$$userId'] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'user_docs',
          },
        },
        {
          $lookup: {
            from: 'userproperties',
            let: {
              caseId: '$_id',
              userId: '$user_id',
              propertyIds: { $ifNull: ['$property_ids', []] },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$case_id', '$$caseId'] },
                      {
                        $and: [
                          { $eq: [{ $ifNull: ['$case_id', null] }, null] },
                          { $eq: ['$user_id', '$$userId'] },
                          // Legacy rows carry no case_id, so fall back to the ids this
                          // case actually submitted. Matching on user_id alone attached
                          // every property the claimant ever selected to every case.
                          { $in: ['$property_id', '$$propertyIds'] },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'usercases',
                  let: { caseId: '$$caseId' },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ['$_id', '$$caseId'] }
                      }
                    },
                    {
                      $project: { claim_id: 1 }
                    }
                  ],
                  as: 'case_info'
                }
              },
              {
                $addFields: {
                  // The property's own claim number. The case-level number is only used
                  // as a fallback when the case covers a single property — otherwise it
                  // would paint one claim's number across every property on the case,
                  // which is what made separate claims look like they shared an id.
                  claim_id: {
                    $ifNull: [
                      '$claim_id',
                      {
                        $cond: [
                          { $lte: [{ $size: { $ifNull: ['$$propertyIds', []] } }, 1] },
                          { $arrayElemAt: ['$case_info.claim_id', 0] },
                          null,
                        ],
                      },
                    ],
                  }
                }
              },
              {
                $project: {
                  case_info: 0
                }
              }
            ],
            as: 'user_properties',
          },
        },
        {
          $lookup: {
            from: 'casestatushistories',
            let: { caseId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$case_id', '$$caseId'] } } },
              { $sort: { createdAt: -1 } },
              {
                $project: {
                  _id: 1,
                  status: 1,
                  previous_status: 1,
                  note: 1,
                  createdAt: 1,
                },
              },
            ],
            as: 'status_history',
          },
        },
        ...RECOVER_CASE_PROPERTY_STAGES,
        {
          $project: {
            _id: 1,
            case_id: 1,
            status: 1,
            claim_status: 1,
          case_status: 1,
          case_status_note: 1,
          case_status_updated_at: 1,
          status_history: 1,
            case_status: 1,
            case_status_note: 1,
            case_status_updated_at: 1,
            status_history: 1,
            claim_id: 1,
            claim_process_task_status: 1,
            document_upload_task_status: 1,
            submitted_at: 1,
            property_ids: 1,
            createdAt: 1,
            'user_info._id': 1,
            'user_info.first_name': 1,
            'user_info.last_name': 1,
            'user_info.email': 1,
            user_details: 1,
            user_docs: 1,
            'user_properties._id': 1,
            'user_properties.property_id': 1,
            'user_properties.property_title': 1,
            'user_properties.property_type': 1,
            'user_properties.amount': 1,
            'user_properties.claim_id': 1,
            'user_properties.is_claimed': 1, // ← ADD THIS
          },
        },
      );

      const results = await UserCases.aggregate(pipeline);

      if (results.length === 0) {
        return NextResponse.json(
          {
            error: public_case_number
              ? 'No claim found with this Case ID'
              : 'No claim found with this Claim ID',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        data: results
      });
    }

    // 🔹 AUTHENTICATION - Only runs for non-public requests
    let user;
    try {
      user = verifyToken(req);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    await connectToDatabase();

    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skipParam = parseInt(searchParams.get('skip'));
    const skip = !isNaN(skipParam) ? skipParam : (page - 1) * limit;

    if (case_id && !Types.ObjectId.isValid(case_id)) {
      return NextResponse.json(
        { error: 'Invalid case_id format' },
        { status: 400 },
      );
    }

    if (my_user_id && !Types.ObjectId.isValid(my_user_id)) {
      return NextResponse.json(
        { error: 'Invalid user_id format' },
        { status: 400 },
      );
    }

    const pipeline = [];

    // 🔹 Filter by specific case ID
    if (case_id) {
      pipeline.push({
        $match: { _id: new Types.ObjectId(case_id) },
      });
    }

    if (claim_id) {
      pipeline.push({
        $match: { claim_id: claim_id }
      });
    }

    // 🔹 Filter by logged-in user's own cases
    if (my_user_id && !case_id && !claim_id) {
      pipeline.push({
        $match: { user_id: new Types.ObjectId(my_user_id) },
      });
    }

    if (search && !case_id && !my_user_id) {
      pipeline.push(
        {
          $lookup: {
            from: 'userinformations',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info',
          },
        },
        { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'userdetails',
            localField: 'user_id',
            foreignField: 'user_id',
            as: 'user_details',
          },
        },
        {
          $match: {
            $or: [
              { case_id: { $regex: search, $options: 'i' } },
              { 'user_info.email': { $regex: search, $options: 'i' } },
              { 'user_details.email_id': { $regex: search, $options: 'i' } },
              { 'user_info.first_name': { $regex: search, $options: 'i' } },
              { 'user_info.last_name': { $regex: search, $options: 'i' } },
              {
                $expr: {
                  $regexMatch: {
                    input: {
                      $concat: [
                        '$user_info.first_name',
                        ' ',
                        '$user_info.last_name',
                      ],
                    },
                    regex: search,
                    options: 'i',
                  },
                },
              },
            ],
          },
        },
      );
    }

    // 🔹 Join related collections
    pipeline.push(
      {
        $lookup: {
          from: 'userinformations',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_info',
        },
      },
      { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'userdetails',
          let: { caseId: '$_id', userId: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$case_id', '$$caseId'] },
                    {
                      $and: [
                        { $eq: [{ $ifNull: ['$case_id', null] }, null] },
                        { $eq: ['$user_id', '$$userId'] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'user_details',
        },
      },
      {
        $lookup: {
          from: 'userdocs',
          let: { caseId: '$_id', userId: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$case_id', '$$caseId'] },
                    {
                      $and: [
                        { $eq: [{ $ifNull: ['$case_id', null] }, null] },
                        { $eq: ['$user_id', '$$userId'] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'user_docs',
        },
      },
      {
        $lookup: {
          from: 'userproperties',
          let: {
              caseId: '$_id',
              userId: '$user_id',
              propertyIds: { $ifNull: ['$property_ids', []] },
            },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$case_id', '$$caseId'] },
                    {
                      $and: [
                        { $eq: [{ $ifNull: ['$case_id', null] }, null] },
                        { $eq: ['$user_id', '$$userId'] },
                        // Legacy rows carry no case_id, so fall back to the ids this
                        // case actually submitted. Matching on user_id alone attached
                        // every property the claimant ever selected to every case.
                        { $in: ['$property_id', '$$propertyIds'] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'usercases',
                let: { caseId: '$$caseId' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$_id', '$$caseId'] }
                    }
                  },
                  {
                    $project: { claim_id: 1 }
                  }
                ],
                as: 'case_info'
              }
            },
            {
              $addFields: {
                // The property's own claim number. The case-level number is only used
                // as a fallback when the case covers a single property — otherwise it
                // would paint one claim's number across every property on the case,
                // which is what made separate claims look like they shared an id.
                claim_id: {
                  $ifNull: [
                    '$claim_id',
                    {
                      $cond: [
                        { $lte: [{ $size: { $ifNull: ['$$propertyIds', []] } }, 1] },
                        { $arrayElemAt: ['$case_info.claim_id', 0] },
                        null,
                      ],
                    },
                  ],
                }
              }
            },
            {
              $project: {
                case_info: 0
              }
            }
          ],
          as: 'user_properties',
        },
      },
      {
        $lookup: {
          from: 'casestatushistories',
          let: { caseId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$case_id', '$$caseId'] } } },
            { $sort: { createdAt: -1 } },
            {
              $project: {
                _id: 1,
                status: 1,
                previous_status: 1,
                note: 1,
                createdAt: 1,
              },
            },
          ],
          as: 'status_history',
        },
      },
      ...RECOVER_CASE_PROPERTY_STAGES,
      {
        $project: {
          _id: 1,
          case_id: 1,
          status: 1,
          claim_status: 1,
          claim_id: 1,
          claim_process_task_status: 1,
          document_upload_task_status: 1,
          document_upload_message: 1,
          submitted_at: 1,
          property_ids: 1,
          createdAt: 1,
          'user_info._id': 1,
          'user_info.first_name': 1,
          'user_info.last_name': 1,
          'user_info.email': 1,
          user_details: 1,
          user_docs: 1,
          'user_properties._id': 1,
          'user_properties.property_id': 1,
          'user_properties.property_title': 1,
          'user_properties.property_type': 1,
          'user_properties.amount': 1,
          'user_properties.claim_id': 1,
          'user_properties.is_claimed': 1,
        },
      },
    );

    // 🔹 Pagination only for admin list
    if (!case_id && !search && !my_user_id) {
      pipeline.push({ $skip: skip }, { $limit: limit });
    }

    // 🔹 Sort dashboard results newest-first, so the most recent claim and its
    // properties lead the page. Placed just after the $match rather than at the
    // head of the pipeline: unshift sorted the whole usercases collection
    // before filtering it down to this user.
    if (my_user_id) {
      pipeline.splice(1, 0, { $sort: { createdAt: -1 } });
    }

    let totalRecords = 0;
    if (!case_id && !search && !my_user_id) {
      totalRecords = await UserCases.countDocuments({});
    }

    const results = await UserCases.aggregate(pipeline);

    if ((case_id || search) && results.length === 0) {
      return NextResponse.json(
        { error: 'No matching case found' },
        { status: 404 },
      );
    }

    const responseData =
      !case_id && !search && !my_user_id
        ? {
          total: totalRecords,
          page,
          limit,
          totalPages: Math.ceil(totalRecords / limit),
          count: results.length,
          data: results,
        }
        : {
          data: results,
        };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('GET /api/case error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}