const SupportModel = require('../model/supportModel');
const supabase = require('../config/db');

const allowedProblemTypes = [
    'Problemas de cuenta y acceso',
    'Falla en la carga de datos/archivos',
    'Errores de interfaz',
    'Sugerencia de mejora/comentarios'
];

exports.createReport = async (req, res) => {
    try {
        const usuario = req.user || req.session?.user;
        if (!usuario) {
            return res.status(401).json({ error: 'Sesión expirada o no iniciada' });
        }

        const { tipo_problema, descripcion } = req.body;
        let url_evidencia = null;

        if (!tipo_problema || !allowedProblemTypes.includes(tipo_problema)) {
            return res.status(400).json({ error: 'Tipo de problema inválido' });
        }
        if (!descripcion || descripcion.trim().length === 0) {
            return res.status(400).json({ error: 'La descripción es obligatoria' });
        }
        if (descripcion.length > 1000) {
            return res.status(400).json({ error: 'La descripción no puede exceder 1000 caracteres' });
        }

        if (req.file) {
            try {
                const fileName = `soporte_${usuario.id}_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('evidencias_soporte')
                    .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

                if (uploadError) {
                    console.warn('No se pudo subir evidencia de soporte:', uploadError.message);
                } else {
                    const { data: publicUrlData } = supabase.storage.from('evidencias_soporte').getPublicUrl(fileName);
                    url_evidencia = publicUrlData?.publicUrl || publicUrlData?.publicURL || `${process.env.SUPABASE_URL}/storage/v1/object/public/evidencias_soporte/${fileName}`;
                }
            } catch (uploadErr) {
                console.warn('Error al subir evidencia de soporte:', uploadErr.message);
            }
        }

        const { data, error } = await SupportModel.create({
            usuario_id: usuario.id,
            tipo_problema,
            descripcion,
            url_evidencia
        });

        if (error) {
            console.error('Error al guardar el reporte de soporte:', error);
            throw error;
        }

        res.status(201).json({ message: 'Reporte de soporte enviado correctamente', ticket: data[0] });
    } catch (err) {
        console.error('Error en supportController.createReport:', err);
        res.status(500).json({ error: 'No se pudo crear el reporte de soporte' });
    }
};

exports.listUserReports = async (req, res) => {
    try {
        const usuario = req.user || req.session?.user;
        if (!usuario) return res.status(401).json({ error: 'No autorizado' });

        const { data, error } = await SupportModel.getByUser(usuario.id);
        if (error) throw error;

        res.json(data || []);
    } catch (err) {
        console.error('Error listando reportes:', err);
        res.status(500).json({ error: 'No se pudieron obtener los reportes' });
    }
};
