import React, { useState } from "react";
import { Alert, Button, FileInput, Select, TextInput } from "flowbite-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", category: "uncategorized" });
  const [publishError, setPublishError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPublishError(null);

    if (!formData.title?.trim() || !formData.content?.trim()) {
      setPublishError("Title and content are required");
      return;
    }

    try {
      setUploading(true);

      // Build multipart form data
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("content", formData.content);
      fd.append("category", formData.category || "uncategorized");

      // If file chosen, append with field name 'image' (backend expects this)
      if (file) {
        fd.append("image", file, file.name);
      }

      // POST to backend create route. We include cookies for verifyToken auth.
      const res = await fetch("/api/post/create", {
        method: "POST",
        body: fd,
        credentials: "include", // important so cookie-based auth is sent
      });

      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message || "Create failed");
        return;
      }

      // success: navigate to the created post by slug (controller returns saved post)
      navigate(`/post/${data.slug}`);
    } catch (err) {
      console.error("Create post error:", err);
      setPublishError("Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-3 max-w-3xl mx-auto min-h-screen">
      <h1 className="text-center text-3xl my-7 font-semibold">Create a post</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 sm:flex-row justify-between">
          <TextInput
            type="text"
            placeholder="Title"
            required
            id="title"
            className="flex-1"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="uncategorized">Select a category</option>
            <option value="javascript">JavaScript</option>
            <option value="reactjs">React.js</option>
            <option value="nextjs">Next.js</option>
          </Select>
        </div>

        <div className="flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3">
          <FileInput type="file" accept="image/*" onChange={handleFile} />
          <Button
            type="button"
            gradientDuoTone="purpleToBlue"
            size="sm"
            outline
            onClick={() => {
              // no-op: keeping for UI compatibility; actual upload occurs on Publish
              if (!file) alert("Select an image (optional) — it'll be uploaded when you publish.");
            }}
          >
            Select Image
          </Button>
        </div>

        {file && (
          <div>
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="w-full h-72 object-cover mb-2"
            />
            <div className="text-sm text-gray-500">Image will be uploaded to server on Publish.</div>
          </div>
        )}

        <ReactQuill
          theme="snow"
          placeholder="Write something..."
          className="h-72 mb-12"
          value={formData.content}
          onChange={(value) => setFormData({ ...formData, content: value })}
        />

        <Button type="submit" gradientDuoTone="purpleToPink" disabled={uploading}>
          {uploading ? "Publishing..." : "Publish"}
        </Button>

        {publishError && (
          <Alert className="mt-5" color="failure">
            {publishError}
          </Alert>
        )}
      </form>
    </div>
  );
}
