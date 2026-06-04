async function submitSupportReport() {
    const tipo = document.getElementById('supportProblemType').value;
    const descripcion = document.getElementById('supportDescription').value.trim();
    const fileInput = document.getElementById('supportEvidenceFile');
    const errorContainer = document.getElementById('supportError');

    errorContainer.classList.add('d-none');
    errorContainer.textContent = '';

    if (!tipo) {
        errorContainer.textContent = 'Selecciona el tipo de problema.';
        errorContainer.classList.remove('d-none');
        return;
    }
    if (!descripcion) {
        errorContainer.textContent = 'Describe el problema para que podamos ayudarte.';
        errorContainer.classList.remove('d-none');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('tipo_problema', tipo);
        formData.append('descripcion', descripcion);
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const f = fileInput.files[0];
            if (!f.type.startsWith('image/')) {
                throw new Error('La evidencia debe ser una imagen');
            }
            formData.append('evidencia', f);
        }

        const response = await fetch('/api/support', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'No se pudo enviar el reporte');
        }

        await showSuccess('Reporte enviado', 'Tu solicitud de soporte ha sido enviada correctamente.');
        document.getElementById('supportProblemType').value = '';
        document.getElementById('supportDescription').value = '';
        if (fileInput) fileInput.value = '';
        const supportModal = bootstrap.Modal.getInstance(document.getElementById('supportModal'));
        supportModal?.hide();
    } catch (error) {
        errorContainer.textContent = error.message;
        errorContainer.classList.remove('d-none');
    }
}

async function transcribeSupportFile() {
    const fileInput = document.getElementById('supportEvidenceFile');
    const desc = document.getElementById('supportDescription');
    const errorContainer = document.getElementById('supportError');

    errorContainer.classList.add('d-none');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        errorContainer.textContent = 'Selecciona un archivo de audio primero.';
        errorContainer.classList.remove('d-none');
        return;
    }
    const f = fileInput.files[0];
    if (!f.type.startsWith('audio/')) {
        errorContainer.textContent = 'El archivo seleccionado no parece ser audio.';
        errorContainer.classList.remove('d-none');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', f);
        formData.append('bucket', 'evidencias_soporte');

        const res = await fetch('/api/integrations/transcribe-upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'No se pudo transcribir');

        if (json.transcript) {
            desc.value = (desc.value ? desc.value + "\n\n" : "") + json.transcript;
            const modal = bootstrap.Modal.getInstance(document.getElementById('supportModal'));
            await showSuccess('Transcripción añadida', 'La transcripción se agregó a la descripción');
        }
    } catch (err) {
        errorContainer.textContent = err.message || 'Error al transcribir';
        errorContainer.classList.remove('d-none');
    }
}
