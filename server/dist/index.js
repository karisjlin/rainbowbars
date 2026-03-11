"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
const reactBuildPath = path_1.default.resolve(__dirname, '../../build');
const reactIndexPath = path_1.default.join(reactBuildPath, 'index.html');
const BAR_COUNT = 7;
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;
const accountBarColors = new Map();
function sendReactApp(res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_1.promises.access(reactIndexPath);
            res.sendFile(reactIndexPath);
        }
        catch (error) {
            res.status(503).send('Frontend build not found. Run "npm run build" in the project root.');
        }
    });
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/static', express_1.default.static(path_1.default.join(reactBuildPath, 'static')));
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield sendReactApp(res);
}));
app.get('/contact', (req, res) => {
    res.send('Hello Contact!');
});
app.get('/about', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield sendReactApp(res);
}));
app.get(['/karis', '/Karis'], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield sendReactApp(res);
}));
app.get('/account', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield sendReactApp(res);
}));
app.get('/api/account/colors/:email', (req, res) => {
    var _a;
    const email = (_a = req.params.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (!email) {
        res.status(400).json({ error: 'Email is required.' });
        return;
    }
    const colors = accountBarColors.get(email) || [];
    res.json({ colors });
});
app.post('/api/account/colors', (req, res) => {
    var _a, _b;
    const email = typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) === 'string' ? req.body.email.trim().toLowerCase() : '';
    const colors = Array.isArray((_b = req.body) === null || _b === void 0 ? void 0 : _b.colors) ? req.body.colors : null;
    if (!email) {
        res.status(400).json({ error: 'Email is required.' });
        return;
    }
    if (!colors || colors.length !== BAR_COUNT || colors.some((color) => typeof color !== 'string')) {
        res.status(400).json({ error: `Exactly ${BAR_COUNT} color values are required.` });
        return;
    }
    const normalizedColors = colors.map((color) => color.trim().toUpperCase());
    const hasInvalidColor = normalizedColors.some((color) => !HEX_COLOR_REGEX.test(color));
    if (hasInvalidColor) {
        res.status(400).json({ error: 'Each color must be a valid hex code like #A1B2C3.' });
        return;
    }
    accountBarColors.set(email, normalizedColors);
    res.status(200).json({ success: true, colors: normalizedColors });
});
app.post("/register", (req, res) => {
    //Do something with the data
    res.sendStatus(201);
});
app.put("/user/:id", (req, res) => {
    res.sendStatus(200);
});
app.patch("/user/:id", (req, res) => {
    res.sendStatus(200);
});
app.delete("/user/:id", (req, res) => {
    //Deleting
    res.sendStatus(200);
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
