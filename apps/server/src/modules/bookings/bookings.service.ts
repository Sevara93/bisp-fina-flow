import {
  prisma,
  BookingStatus,
  type Booking,
  type BookingWithRelations,
} from '@bisp-final-flow/db'
import { notifyProvider } from "../../lib/telegram";

export async function getBookingById(
  id: string
): Promise<BookingWithRelations | null> {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      venue: true,
      manager: true,
      expenses: true,
    },
  })
}

export function calculateCost(
  pricePerHour: number,
  startTime: Date,
  endTime: Date
): number {
  const hours = (endTime.getTime() - startTime.getTime()) / 3_600_000
  return Math.round(pricePerHour * hours * 100) / 100
}

export async function confirmBooking(
  bookingId: string,
  companyId: string
): Promise<Booking> {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
      include: { venue: true },
    })

    await tx.expense.create({
      data: {
        amount:      booking.cost,
        category:    booking.venue.category,
        description: `Бронирование: ${booking.venue.name}`,
        bookingId:   booking.id,
        companyId,
      },
    })

    // Находим провайдера и отправляем уведомление
    const provider = await tx.user.findUnique({
      where: { id: booking.venue.providerId },
    })

    if (provider) {
      await notifyProvider(
        provider.telegramChatId,
        provider.telegramUsername,
        `<b>Бронирование подтверждено!</b>\n` +
        `Площадка: ${booking.venue.name}\n` +
        `Дата: ${booking.startTime.toLocaleDateString("ru-RU")}\n` +
        `Стоимость: ${booking.cost}`
      )
    }

    return booking
  })
}

export async function createBooking(
  managerId: string,
  companyId: string,
  data: {
    venueId: string;
    startTime: string;
    endTime: string;
    eventName?: string;
    notes?: string;
  }
): Promise<Booking> {
  const venue = await prisma.venue.findUnique({
    where: { id: data.venueId },
  })

  if (!venue) {
    throw new Error("Venue not found")
  }

  const startTime = new Date(data.startTime)
  const endTime = new Date(data.endTime)

  const cost = calculateCost(
    Number(venue.pricePerHour),
    startTime,
    endTime
  )

  return prisma.booking.create({
    data: {
      managerId,
      companyId,
      venueId: data.venueId,
      startTime,
      endTime,
      cost,
      eventName: data.eventName,
      notes: data.notes,
      status: BookingStatus.PENDING,
    },
  })
}
