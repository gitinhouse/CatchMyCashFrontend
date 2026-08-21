import { NextResponse } from 'next/server';
import connectToDatabase from '../../lib/mongodb';
import UserCases from '../../models/userCases';
import User from '../../models/UserInformation';
import { Types } from 'mongoose';
import { verifyToken } from '../../lib/verifyToken';
import { generateCaseNumber } from '../../lib/generateCaseNumber';


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

    const existingCase = await UserCases.findOne({ user_id });
    if (existingCase) {
      if (normalizedPropertyIds.length > 0) {
        const updatedCase = await UserCases.findOneAndUpdate(
          { user_id },
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
    if (public_search === 'true' && claim_id) {
      await connectToDatabase();
      
      const pipeline = [];
      
      // Filter by claim_id
      pipeline.push({
        $match: { claim_id: claim_id }
      });

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
                  claim_id: { $arrayElemAt: ['$case_info.claim_id', 0] }
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
          $project: {
            _id: 1,
            case_id: 1,
            status: 1,
            claim_status: 1,
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
          },
        },
      );

      const results = await UserCases.aggregate(pipeline);

      if (results.length === 0) {
        return NextResponse.json(
          { error: 'No claim found with this Claim ID' },
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
                claim_id: { $arrayElemAt: ['$case_info.claim_id', 0] }
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
        $project: {
          _id: 1,
          case_id: 1,
          status: 1,
          claim_status: 1,
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
        },
      },
    );

    // 🔹 Pagination only for admin list
    if (!case_id && !search && !my_user_id) {
      pipeline.push({ $skip: skip }, { $limit: limit });
    }

    // 🔹 Sort dashboard results newest-first
    if (my_user_id) {
      pipeline.unshift({ $sort: { createdAt: -1 } });
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