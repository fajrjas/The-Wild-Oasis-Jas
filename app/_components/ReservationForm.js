"use client";
import { differenceInDays, isWithinInterval } from "date-fns";
import { createReservation } from "../_lib/actions";
import { useReservation } from "./ReservationContext";
// import isAlreadyBooked from "../_lib/isAlreadyBooked";
import { useFormStatus } from "react-dom";

function isAlreadyBooked(range, datesArr) {
  return (
    range?.from &&
    range?.to &&
    datesArr.some((date) =>
      isWithinInterval(date, { start: range.from, end: range.to })
    )
  );
}

function ReservationForm({ cabin, user, bookedDates }) {
  const { range, resetRange } = useReservation();
  // const { range, resetRange, isAlreadyBooked } = useReservation();
  const { maxCapacity, regularPrice, discount, id } = cabin;
  const startDate = range?.from;
  const endDate = range?.to;

  // console.log(startDate);

  const displayRange = isAlreadyBooked(range, bookedDates) ? {} : range;
  console.log(displayRange);
  const numNights = differenceInDays(endDate, startDate);
  // console.log("Numnights: ", numNights);
  const cabinPrice = numNights * (regularPrice - discount);

  const bookingDate = {
    startDate,
    endDate,
    numNights,
    cabinPrice,
    cabinId: id,
  };
  // const createReservationWithBookingDate = () => {
  //   const boundCreateReservation = createReservation.bind(null, bookingDate);
  //   boundCreateReservation();
  //   resetRange();
  // };
  const createReservationWithBookingDate = createReservation.bind(
    null,
    bookingDate
  );

  return (
    <div className="scale-[1.01]">
      <div className="bg-primary-800 text-primary-300 px-16 py-2 flex justify-between items-center">
        <p>Logged in as</p>

        <div className="flex gap-4 items-center">
          <img
            // Important to display google profile images
            referrerPolicy="no-referrer"
            className="h-8 rounded-full"
            src={user.image}
            alt={user.name}
          />
          <p>{user.name}</p>
        </div>
      </div>

      <form
        className="bg-primary-900 py-10 px-16 text-lg flex gap-5 flex-col"
        // action={createReservationWithBookingDate}
        action={async (formData) => {
          await createReservationWithBookingDate(formData);
          resetRange();
        }}
      >
        <div className="space-y-2">
          <label htmlFor="numGuests">How many guests?</label>
          <select
            name="numGuests"
            id="numGuests"
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm"
            required
          >
            <option value="" key="">
              Select number of guests...
            </option>
            {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((x) => (
              <option value={x} key={x}>
                {x} {x === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="observations">
            Anything we should know about your stay?
          </label>
          <textarea
            name="observations"
            id="observations"
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm"
            placeholder="Any pets, allergies, special requirements, etc.?"
          />
        </div>

        <div className="flex justify-end items-center gap-6">
          {startDate && displayRange?.to ? (
            <Button />
          ) : (
            <p className="text-primary-300 text-base">
              Start by selecting dates
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="bg-accent-500 px-8 py-4 text-primary-800 font-semibold hover:bg-accent-600 transition-all disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-300"
    >
      {pending ? "Reserving..." : " Reserve now"}
    </button>
  );
}

export default ReservationForm;
