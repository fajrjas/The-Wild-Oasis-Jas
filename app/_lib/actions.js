"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";
import { supabase } from "./supabase";
import { getBookings, updateBooking } from "./data-service";
import { redirect } from "next/navigation";

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error("Not authorized to access this!");
  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error("Please provide a valid national ID");
  const updateData = { nationality, nationalID, countryFlag };

  const { data, error } = await supabase
    .from("guests")
    .update(updateData)
    .eq("id", session.user.guestId);

  if (error) throw new Error("Guest could not be updated");
  revalidatePath("/account/profile");
}

export async function createReservation(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error("Not authorized to access this!");
  // console.log(!bookingData.numNights);
  // console.log(!bookingData.cabinPrice);
  // console.log(!bookingData.numNights && !bookingData.cabinPrice);
  // console.log(bookingData);
  console.log("Start date: ", bookingData.startDate);
  console.log("End date: ", bookingData.endDate);
  // console.log("formdata: ", formData);
  if (!bookingData.endDate) throw new Error("Please select a date");

  const newReservation = {
    ...bookingData,
    guestId: session.user.guestId,
    observations: formData.get("observations").slice(0, 400),
    numGuests: Number(formData.get("numGuests")),
    isPaid: false,
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    hasBreakfast: false,
    status: "unconfirmed",
  };

  console.log(newReservation);
  const { error } = await supabase
    .from("bookings")
    .insert([newReservation])
    // So that the newly created object gets returned!
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be created");
  }

  revalidatePath(`/cabins/${bookingData.cabinId}`);
  redirect("/cabins/thankyou");
}

export async function updateReservation(formData) {
  const session = await auth();
  if (!session) throw new Error("Not authorized to access this!");

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);
  const bookingId = Number(formData.get("bookingId"));

  if (!guestBookingsIds.includes(bookingId))
    throw new Error("You are not allowed to update this booking!");

  const numGuests = Number(formData.get("numGuests"));
  const observations = formData.get("observations").slice(0, 400);
  const updatedData = { numGuests, observations };

  const { error } = await supabase
    .from("bookings")
    .update(updatedData)
    .eq("id", bookingId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be updated");
  }
  revalidatePath(`/account/reservations/edit/${bookingId}`);
  revalidatePath("/account/reservations");
  redirect("/account/reservations");
  // console.log(bookingId);
}

export async function deleteReservation(bookingId) {
  const session = await auth();
  if (!session) throw new Error("Not authorized to access this!");

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);

  // const justWait = await new Promise((res) => setTimeout(res, 3000));
  // throw new Error();

  if (!guestBookingsIds.includes(bookingId))
    throw new Error("You are not allowed to delete this booking!");

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    console.error(error);
    throw new Error("Booking could not be deleted");
  }
  revalidatePath("/account/reservations");
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
