import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Upload, Camera, Check, AlertCircle, Loader } from 'lucide-react';
import '../styles/ProfileUploadModal.css';

const ProfileUploadModal = ({ isOpen, onClose }) => {
  const [athleteName, setAthleteName] = useState('');
  const [allAthletes, setAllAthletes] = useState([]);
  const [filteredAthletes, setFilteredAthletes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dniFile, setDniFile] = useState(null);
  const [athletePhoto, setAthletePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, verifying, success, error
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const handleSavePhoto = async () => {
    if (!athletePhoto || !athleteName) return;
    
    // Encontrar el ID del atleta seleccionado
    const selectedAthlete = allAthletes.find(a => a.name === athleteName);
    
    if (!selectedAthlete) {
        setVerificationStatus('error');
        setVerificationMessage('Error: Atleta no encontrado en la base de datos.');
        return;
    }

    setIsUploading(true);
    
    try {
        const formData = new FormData();
        formData.append('athlete_id', selectedAthlete.athlete_id);
        formData.append('file', athletePhoto);
        
        const response = await fetch('http://localhost:8000/api/upload-profile-picture', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            setIsUploading(false);
            setVerificationMessage('¡Foto subida correctamente!');
            setVerificationStatus('success');
            setTimeout(() => {
                handleClose();
            }, 1500);
        } else {
            throw new Error(data.message || 'Error al subir la imagen');
        }
        
    } catch (error) {
        console.error('Error uploading photo:', error);
        setIsUploading(false);
        setVerificationStatus('error');
        setVerificationMessage('Error al guardar la foto. Inténtalo de nuevo.');
    }
  };
  
  const dniInputRef = useRef(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
        fetch('http://localhost:8000/api/athletes')
            .then(res => res.json())
            .then(data => setAllAthletes(data))
            .catch(err => console.error("Error loading athletes:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setAthleteName(value);
    
    if (value.length > 1) {
        const filtered = allAthletes.filter(athlete => 
            athlete.name.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 10); // Limit to 10 results
        setFilteredAthletes(filtered);
        setShowDropdown(true);
    } else {
        setShowDropdown(false);
    }
  };

  const handleSelectAthlete = (name) => {
    setAthleteName(name);
    setShowDropdown(false);
  };

  const handleDniChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDniFile(file);
      setVerificationStatus('idle'); // Reset status on new file
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAthletePhoto(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleVerify = async () => {
    if (!dniFile || !athleteName) {
      setVerificationStatus('error');
      setVerificationMessage('Por favor, selecciona tu nombre y sube tu DNI.');
      return;
    }

    setVerificationStatus('verifying');
    
    const formData = new FormData();
    formData.append('dni_image', dniFile);
    formData.append('athlete_name', athleteName);

    try {
      // Assuming the backend is running on localhost:8000 based on main.py
      const response = await fetch('http://localhost:8000/api/verify-id', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.verified) {
        setVerificationStatus('success');
        setVerificationMessage(data.msg || 'Identidad verificada correctamente.');
      } else {
        setVerificationStatus('error');
        setVerificationMessage(data.msg || 'No se pudo verificar la identidad. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error verifying identity:', error);
      setVerificationStatus('error');
      setVerificationMessage('Error de conexión con el servidor.');
    }
  };

  const handleClose = () => {
    // Cleanup preview URL to avoid memory leaks
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAthleteName('');
    setDniFile(null);
    setAthletePhoto(null);
    setPreviewUrl(null);
    setVerificationStatus('idle');
    setVerificationMessage('');
    setShowDropdown(false);
    setShowDropdown(false);
    onClose();
  };



  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => {
        e.stopPropagation();
        setShowDropdown(false); // Close dropdown if clicking elsewhere in modal
      }}>
        <div className="modal-header">
          <h2>Subir Foto de Perfil</h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 1. Buscador de Nombre */}
          <div className="form-group">
            <label>Nombre del Atleta</label>
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon-modal" />
              <input
                type="text"
                className="modal-input"
                placeholder="Busca tu nombre..."
                value={athleteName}
                onChange={handleSearchChange}
                onFocus={() => {
                    if (athleteName.length > 1) setShowDropdown(true);
                }}
              />
              
              {showDropdown && filteredAthletes.length > 0 && (
                <ul className="athlete-dropdown">
                    {filteredAthletes.map(athlete => (
                        <li 
                            key={athlete.athlete_id} 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAthlete(athlete.name);
                            }}
                        >
                            {athlete.name}
                        </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* 2. Subida de DNI */}
          <div className="form-group">
            <label>Verificación de Identidad (DNI)</label>
            <div className="upload-section" onClick={() => dniInputRef.current.click()}>
              <input
                type="file"
                ref={dniInputRef}
                className="file-input"
                accept="image/*"
                onChange={handleDniChange}
              />
              <div className="upload-trigger">
                <Upload size={24} />
                <span>{dniFile ? dniFile.name : 'Haz clic para subir foto del DNI'}</span>
              </div>
            </div>
            
            {/* Botón de Verificar */}
            <button 
                className="btn btn-secondary" 
                style={{marginTop: '10px', width: '100%'}}
                onClick={handleVerify}
                disabled={verificationStatus === 'verifying' || !dniFile}
            >
                {verificationStatus === 'verifying' ? (
                    <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                        <Loader size={16} className="animate-spin" /> Verificando...
                    </span>
                ) : 'Verificar Identidad'}
            </button>

            {/* Mensajes de Estado */}
            {verificationStatus === 'success' && (
              <div className="verification-status success">
                <Check size={18} />
                <span>{verificationMessage}</span>
              </div>
            )}
            {verificationStatus === 'error' && (
              <div className="verification-status error">
                <AlertCircle size={18} />
                <span>{verificationMessage}</span>
              </div>
            )}

            <div className="privacy-notice">
              🔒 Privacidad Garantizada: La imagen de tu documento se procesa en tiempo real para verificar el texto y se elimina inmediatamente de la memoria de nuestros servidores. Nunca se guarda en base de datos.
            </div>
          </div>

          {/* 3. Subida de Foto de Atleta */}
          <div className="form-group">
            <label>Foto de Perfil</label>
            <div className="upload-section" onClick={() => photoInputRef.current.click()}>
              <input
                type="file"
                ref={photoInputRef}
                className="file-input"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              <div className="upload-trigger">
                <Camera size={24} />
                <span>{athletePhoto ? 'Cambiar foto' : 'Subir tu foto de perfil'}</span>
              </div>
            </div>
            
            {previewUrl && (
              <div className="preview-container">
                <img src={previewUrl} alt="Vista previa" className="preview-image" />
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
          <button 
            className="btn btn-primary" 
            disabled={verificationStatus !== 'success' || !athletePhoto || isUploading}
            onClick={handleSavePhoto}
          >
            {isUploading ? (
                <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Loader size={16} className="animate-spin" /> Guardando...
                </span>
            ) : 'Guardar Foto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileUploadModal;
