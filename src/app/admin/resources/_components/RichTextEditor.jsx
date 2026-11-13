'use client';

import React, { useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extensions';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import {
  Bold,
  Code,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  Upload,
} from 'lucide-react';
import Modal from './Modal';
import { IMAGE_ACCEPT, uploadImage } from './shared';

const IMAGE_SRC = /^(https:\/\/[^\s"'<>]+|\/media\/[a-f0-9]{24})$/i;
const BLOCKS = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h2', label: 'Heading 2 — section' },
  { value: 'h3', label: 'Heading 3 — sub-section' },
  { value: 'h4', label: 'Heading 4' },
];

/** A link as typed: bare domains get https://, site paths stay relative. */
function normalizeHref(raw) {
  const href = raw.trim();
  if (!href) return '';
  if (/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href)) return href;
  if (/^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(href)) return `mailto:${href}`;
  return `https://${href.replace(/^\/+/, '')}`;
}

function ToolButton({ label, icon: Icon, active = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      // Keep focus (and the selection) in the text while clicking: otherwise
      // the button holds focus until the editor takes it back a frame later,
      // and a key pressed in between is lost.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? 'bg-[#0A0A0A] text-white' : 'text-[#4A4A4A] hover:bg-[#F0EEEB] hover:text-[#0A0A0A]'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="w-px h-5 bg-[#E8E6E3] mx-1" />;

/**
 * The article body editor. Reports HTML and plain text on every change;
 * `onReady` receives the editor's own rendering of the starting HTML, so the
 * caller can compare later changes against it.
 */
export default function RichTextEditor({ initialHtml = '', onChange, onReady, onNotice, invalid = false, describedBy }) {
  const callbacks = useRef({ onChange, onReady, onNotice });
  callbacks.current = { onChange, onReady, onNotice };

  const [linkDialog, setLinkDialog] = useState(null); // { href }
  const [imageDialog, setImageDialog] = useState(null); // { src, alt, editing }
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInput = useRef(null);
  const [dropping, setDropping] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          // The site decides target and rel when it saves (external links
          // open in a new tab), so the editor adds neither.
          HTMLAttributes: { target: null, rel: null },
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: 'Start writing… Give each main section a “Heading 2”: those headings become the article’s table of contents.',
      }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'resource-prose resource-editor-content',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Article body',
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      },
      // Images dropped or pasted in are uploaded, rather than the browser
      // leaving the page to open them.
      handleDrop: (view, event, slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        files.forEach((file) => insertUploaded(view, file, at));
        return true;
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter((f) => f.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        files.forEach((file) => insertUploaded(view, file));
        return true;
      },
    },
    onCreate: ({ editor: e }) => callbacks.current.onReady?.(e.getHTML(), e.getText()),
    onUpdate: ({ editor: e }) => callbacks.current.onChange?.(e.getHTML(), e.getText()),
  });

  async function insertUploaded(view, file, at) {
    callbacks.current.onNotice?.({ type: 'info', message: `Uploading ${file.name}…` });
    try {
      const src = await uploadImage(file);
      const node = view.state.schema.nodes.image.create({ src, alt: '' });
      const pos = typeof at === 'number' ? at : view.state.selection.to;
      view.dispatch(view.state.tr.insert(Math.min(pos, view.state.doc.content.size), node));
      callbacks.current.onNotice?.({
        type: 'success',
        message: 'Image added. Select it and press the image button to describe it for screen readers and search.',
      });
    } catch (err) {
      callbacks.current.onNotice?.({ type: 'error', message: err.message });
    }
  }

  // The snapshot's editor stays null until the first transaction after the
  // editor is created, so fall back to the instance useEditor returned.
  const state = useEditorState({
    editor,
    selector: ({ editor: fromSnapshot }) => {
      const e = fromSnapshot || editor;
      return e
        ? {
            block: e.isActive('heading', { level: 2 })
              ? 'h2'
              : e.isActive('heading', { level: 3 })
                ? 'h3'
                : e.isActive('heading', { level: 4 })
                  ? 'h4'
                  : 'p',
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            strike: e.isActive('strike'),
            code: e.isActive('code'),
            link: e.isActive('link'),
            bulletList: e.isActive('bulletList'),
            orderedList: e.isActive('orderedList'),
            blockquote: e.isActive('blockquote'),
            image: e.isActive('image'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null;
    },
  });

  if (!editor || !state) {
    return (
      <div className="rounded-xl border border-[#E8E6E3] bg-white min-h-[480px] flex items-center justify-center text-sm text-[#888888]">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#E1261C]" />
        Loading the editor…
      </div>
    );
  }

  const chain = () => editor.chain().focus();

  const setBlock = (value) => {
    if (value === 'p') chain().setParagraph().run();
    else chain().setHeading({ level: Number(value.slice(1)) }).run();
  };

  const openLink = () => {
    setLinkDialog({ href: editor.getAttributes('link').href || '' });
  };

  const applyLink = () => {
    const href = normalizeHref(linkDialog?.href || '');
    if (!href) {
      chain().extendMarkRange('link').unsetLink().run();
    } else if (editor.state.selection.empty && !editor.isActive('link')) {
      chain()
        .insertContent({ type: 'text', text: linkDialog.href.trim(), marks: [{ type: 'link', attrs: { href } }] })
        .run();
    } else {
      chain().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkDialog(null);
  };

  const openImage = () => {
    setImageError('');
    if (editor.isActive('image')) {
      const { src = '', alt = '' } = editor.getAttributes('image');
      setImageDialog({ src, alt, editing: true });
    } else {
      setImageDialog({ src: '', alt: '', editing: false });
    }
  };

  const onPickFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImageBusy(true);
    setImageError('');
    try {
      const src = await uploadImage(file);
      setImageDialog((d) => ({ ...d, src }));
    } catch (err) {
      setImageError(err.message);
    } finally {
      setImageBusy(false);
    }
  };

  const applyImage = () => {
    const src = (imageDialog?.src || '').trim();
    const alt = (imageDialog?.alt || '').trim();
    if (!IMAGE_SRC.test(src)) {
      setImageError('Upload an image, or enter an address that starts with https://');
      return;
    }
    if (imageDialog.editing) {
      chain().updateAttributes('image', { src, alt }).run();
    } else {
      chain()
        .setImage({ src, alt })
        // Put the cursor in the paragraph after the image (making one if
        // needed), so the next key typed does not replace the image.
        .command(({ tr, dispatch }) => {
          if (!(tr.selection instanceof NodeSelection)) return true;
          const after = tr.selection.to;
          if (!tr.doc.resolve(after).nodeAfter?.isTextblock) {
            tr.insert(after, tr.doc.type.schema.nodes.paragraph.create());
          }
          if (dispatch) tr.setSelection(TextSelection.create(tr.doc, after + 1));
          return true;
        })
        .run();
    }
    setImageDialog(null);
  };

  return (
    <div
      className={`rounded-xl border bg-white ${invalid ? 'border-[#E1261C] ring-2 ring-[#FCE9E7]' : 'border-[#E8E6E3]'} ${
        dropping ? 'ring-2 ring-[#E1261C]/40' : ''
      }`}
      onDragEnter={(e) => e.dataTransfer?.types?.includes('Files') && setDropping((n) => n + 1)}
      onDragLeave={() => setDropping((n) => Math.max(0, n - 1))}
      onDrop={() => setDropping(0)}
    >
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-[45px] lg:top-0 z-20 flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[#E8E6E3] bg-white/95 backdrop-blur rounded-t-xl"
      >
        <select
          aria-label="Text style"
          value={state.block}
          onChange={(e) => setBlock(e.target.value)}
          className="h-8 mr-1 px-2 text-xs font-semibold rounded-md border border-[#E8E6E3] bg-white text-[#0A0A0A] focus:outline-none focus:border-[#E1261C]"
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        <ToolButton label="Bold" icon={Bold} active={state.bold} onClick={() => chain().toggleBold().run()} />
        <ToolButton label="Italic" icon={Italic} active={state.italic} onClick={() => chain().toggleItalic().run()} />
        <ToolButton label="Underline" icon={Underline} active={state.underline} onClick={() => chain().toggleUnderline().run()} />
        <ToolButton label="Strikethrough" icon={Strikethrough} active={state.strike} onClick={() => chain().toggleStrike().run()} />
        <ToolButton label="Inline code" icon={Code} active={state.code} onClick={() => chain().toggleCode().run()} />
        <Divider />
        <ToolButton label="Link" icon={Link2} active={state.link} onClick={openLink} />
        <ToolButton label="Image" icon={ImagePlus} active={state.image} onClick={openImage} />
        <Divider />
        <ToolButton label="Bulleted list" icon={List} active={state.bulletList} onClick={() => chain().toggleBulletList().run()} />
        <ToolButton label="Numbered list" icon={ListOrdered} active={state.orderedList} onClick={() => chain().toggleOrderedList().run()} />
        <ToolButton label="Quote" icon={Quote} active={state.blockquote} onClick={() => chain().toggleBlockquote().run()} />
        <ToolButton label="Divider line" icon={Minus} onClick={() => chain().setHorizontalRule().run()} />
        <Divider />
        <ToolButton label="Clear formatting" icon={RemoveFormatting} onClick={() => chain().unsetAllMarks().clearNodes().run()} />
        <ToolButton label="Undo" icon={Undo2} disabled={!state.canUndo} onClick={() => chain().undo().run()} />
        <ToolButton label="Redo" icon={Redo2} disabled={!state.canRedo} onClick={() => chain().redo().run()} />
      </div>

      <EditorContent editor={editor} />

      <Modal
        open={Boolean(linkDialog)}
        title={state.link ? 'Edit link' : 'Add a link'}
        onClose={() => setLinkDialog(null)}
        returnFocus={() => editor.commands.focus()}
        footer={
          <>
            {state.link && (
              <button
                type="button"
                onClick={() => {
                  chain().extendMarkRange('link').unsetLink().run();
                  setLinkDialog(null);
                }}
                className="mr-auto px-3 py-2 text-sm font-semibold rounded-lg text-[#B11912] hover:bg-[#FCE9E7]"
              >
                Remove link
              </button>
            )}
            <button
              type="button"
              onClick={() => setLinkDialog(null)}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg border border-[#E8E6E3] bg-white text-[#4A4A4A] hover:bg-[#F7F5F2]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyLink}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-[#E1261C] text-white hover:bg-[#B11912]"
            >
              {state.link ? 'Update link' : 'Add link'}
            </button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyLink();
          }}
        >
          <label className="block">
            <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">Address</span>
            <input
              type="text"
              value={linkDialog?.href || ''}
              onChange={(e) => setLinkDialog({ href: e.target.value })}
              placeholder="/how-it-works or https://www.sco.ca.gov/"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
            />
          </label>
          <p className="text-[11px] text-[#888888] mt-2 leading-relaxed">
            Link to other CatchMyCash pages with a path such as <code>/faq</code>. Links to other sites open in a new tab.
          </p>
        </form>
      </Modal>

      <Modal
        open={Boolean(imageDialog)}
        title={imageDialog?.editing ? 'Edit image' : 'Add an image'}
        onClose={() => setImageDialog(null)}
        returnFocus={() => editor.commands.focus()}
        footer={
          <>
            <button
              type="button"
              onClick={() => setImageDialog(null)}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg border border-[#E8E6E3] bg-white text-[#4A4A4A] hover:bg-[#F7F5F2]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyImage}
              disabled={imageBusy}
              className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-[#E1261C] text-white hover:bg-[#B11912] disabled:opacity-60"
            >
              {imageDialog?.editing ? 'Save image' : 'Insert image'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={imageBusy}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-[#E8E6E3] bg-white text-[#0A0A0A] hover:bg-[#F7F5F2] disabled:opacity-60"
            >
              {imageBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {imageBusy ? 'Uploading…' : 'Upload from computer'}
            </button>
            <span className="text-[11px] text-[#888888]">JPEG, PNG, WebP or GIF, up to 5 MB</span>
            <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} onChange={onPickFile} className="hidden" />
          </div>
          <label className="block">
            <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">…or image address</span>
            <input
              type="text"
              value={imageDialog?.src || ''}
              onChange={(e) => setImageDialog((d) => ({ ...d, src: e.target.value }))}
              placeholder="https://…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
            />
          </label>
          {imageDialog?.src && IMAGE_SRC.test(imageDialog.src) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageDialog.src} alt="" className="max-h-40 rounded-lg border border-[#E8E6E3]" />
          )}
          <label className="block">
            <span className="block text-xs font-semibold text-[#4A4A4A] mb-1.5">Description (alt text)</span>
            <input
              type="text"
              value={imageDialog?.alt || ''}
              maxLength={200}
              onChange={(e) => setImageDialog((d) => ({ ...d, alt: e.target.value }))}
              placeholder="What the image shows, e.g. “A completed California claim form”"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E8E6E3] focus:outline-none focus:border-[#E1261C] focus:ring-2 focus:ring-[#FCE9E7]"
            />
            <span className="block text-[11px] text-[#888888] mt-1">
              Read aloud by screen readers and used by search engines. Leave empty only for decorative images.
            </span>
          </label>
          {imageError && <p className="text-xs font-semibold text-[#B11912]">{imageError}</p>}
        </div>
      </Modal>
    </div>
  );
}
