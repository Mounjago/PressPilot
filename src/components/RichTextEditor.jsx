import React, { useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder = "Rédigez votre message..." }) => {
  const quillRef = useRef();

  // Configuration de la barre d'outils
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image'
  ];

  // Gestionnaire personnalisé pour l'insertion d'images
  function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = () => {
      const file = input.files[0];
      if (file) {
        // Créer une URL temporaire pour l'image
        const reader = new FileReader();
        reader.onload = (e) => {
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();

          // Insérer l'image dans l'éditeur
          quill.insertEmbed(range.index, 'image', e.target.result);

          // Déplacer le curseur après l'image
          quill.setSelection(range.index + 1);
        };
        reader.readAsDataURL(file);
      }
    };
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          height: '300px',
          marginBottom: '50px'
        }}
      />
    </div>
  );
};

export default RichTextEditor;