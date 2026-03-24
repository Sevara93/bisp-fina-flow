import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { getVenues, createVenue } from "./venues.service";
import { Role } from "@bisp-final-flow/db";

const router = Router();

// GET /api/venues — все могут смотреть каталог
router.get("/", requireAuth, async (req, res) => {
  const { category, capacity } = req.query;
  const venues = await getVenues({
    category: category as string,
    capacity: capacity ? Number(capacity) : undefined,
  });
  res.json(venues);
});

// POST /api/venues — только PROVIDER создаёт площадку
router.post(
  "/",
  requireAuth,
  requireRole(Role.PROVIDER),
  async (req, res) => {
    const venue = await createVenue(req.user!.id, req.body);
    res.status(201).json(venue);
  }
);

export default router;
