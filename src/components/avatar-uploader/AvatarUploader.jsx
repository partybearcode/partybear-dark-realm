import './AvatarUploader.css'

function AvatarUploader({ currentAvatar, onUpload, onUrlSave }) {
  return (
    <div className="avatar-uploader">
      <div className="avatar-preview">
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Profile"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="avatar-placeholder">No Avatar</div>
        )}
      </div>
      <div className="avatar-actions">
        <label className="upload-button">
          Upload Image
          <input
            type="file"
            accept="image/*"
            onChange={(event) => onUpload(event.target.files?.[0])}
          />
        </label>
        <div className="avatar-url">
          <input
            type="text"
            placeholder="Paste image URL"
            onBlur={(event) => onUrlSave(event.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

export default AvatarUploader
