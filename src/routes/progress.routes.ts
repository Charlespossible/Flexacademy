import { Router } from "express";

const stub = Router();
stub.all("*", (_req, res) => res.status(501).json({ success: false, message: "Not implemented yet." }));
export default stub;
