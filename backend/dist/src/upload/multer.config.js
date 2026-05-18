"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerConfig = void 0;
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
exports.multerConfig = {
    storage: (0, multer_1.diskStorage)({
        destination: (req, _file, cb) => {
            const folder = req.path.includes('avatar') ? 'uploads/avatars' : 'uploads/logos';
            cb(null, folder);
        },
        filename: (_req, file, cb) => {
            const ext = (0, path_1.extname)(file.originalname);
            cb(null, `${(0, uuid_1.v4)()}${ext}`);
        },
    }),
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
    },
    limits: { fileSize: 2 * 1024 * 1024 },
};
//# sourceMappingURL=multer.config.js.map