const supabase = require('../config/db');

exports.isSupport = async (req, res, next) => {
    const user = req.user || req.session?.user;
    if (!user) return res.status(401).json({ error: 'No autorizado' });


    if (user.is_support || user.rol === 'soporte') return next();

    return res.status(403).json({ error: 'Acceso restringido' });
};

module.exports = { isSupport: exports.isSupport };
