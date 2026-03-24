import { prisma } from "@bisp-final-flow/db";

// Получить все активные площадки с фильтрами
export async function getVenues(filters: {
  category?: string;
  capacity?: number;
}) {
  return prisma.venue.findMany({
    where: {
      isActive: true,
      ...(filters.category && { category: filters.category as any }),
      ...(filters.capacity && { capacity: { gte: filters.capacity } }),
    },
    include: { provider: { select: { id: true, name: true, email: true } } },
  });
}

// Создать площадку — только PROVIDER
export async function createVenue(
  providerId: string,
  data: {
    name: string;
    description?: string;
    category: string;
    pricePerHour: number;
    capacity?: number;
    address?: string;
    photos?: string[];
  }
) {
  return prisma.venue.create({
    data: {
      ...data,
      category: data.category as any,
      pricePerHour: data.pricePerHour,
      providerId,
    },
  });
}
