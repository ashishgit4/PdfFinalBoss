interface LoadingStateProps {
  progress?: number;
  label: string;
  fileName?: string;
}

export function LoadingState({ progress, label, fileName }: LoadingStateProps) {
  const isUploading = progress !== undefined;

  return (
    <div className="card-state active flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in-95 duration-200">
      {isUploading ? (
        <>
          <div className="upload-icon-container shadow-inner">
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 className="card-state-title">{label}</h3>
          {fileName && <p className="card-state-subtitle truncate max-w-xs px-4" title={fileName}>{fileName}</p>}
          
          <div className="progress-bar-container w-full max-w-xs">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{progress}%</span>
        </>
      ) : (
        <>
          <div className="spinner-container">
            <svg className="spinner-icon animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <circle cx="12" cy="12" r="10" stroke="rgba(243,239,230,0.1)"></circle>
              <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor"></path>
            </svg>
          </div>
          <h3 className="card-state-title">{label}</h3>
          <p className="card-state-subtitle">Please wait, processing document algorithms.</p>
        </>
      )}
    </div>
  );
}
