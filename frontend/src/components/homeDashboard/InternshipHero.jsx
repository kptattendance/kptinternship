// src/components/homeDashboard/InternshipHero.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const SLIDE_PAUSE_MS = 4000; // how long each photo stays on screen
const SLIDE_MOVE_MS = 700; // how long the scroll to the next photo takes

export default function InternshipHero() {
  const [photos, setPhotos] = useState([]);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Only photos approved by the placement officer are returned
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await axios.get(
          backendUrl + "/api/students/public/internship-photos"
        );
        setPhotos(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch internship photos:", err);
      }
    };
    fetchPhotos();
  }, [backendUrl]);

  // Scroll to the next photo after every pause
  useEffect(() => {
    if (photos.length < 2 || paused) return;

    const timer = setTimeout(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, SLIDE_PAUSE_MS);

    return () => clearTimeout(timer);
  }, [index, paused, photos.length]);

  // The last slide is a copy of the first one. Once it is fully shown, jump
  // back to the real first slide without animation so the scroll never ends.
  useEffect(() => {
    if (index < photos.length || photos.length < 2) return;

    const timer = setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, SLIDE_MOVE_MS);

    return () => clearTimeout(timer);
  }, [index, photos.length]);

  const goTo = (i) => {
    setAnimate(true);
    setIndex(i);
  };

  // No approved photos yet → show the college photo
  if (photos.length === 0) {
    return (
      <div
        className="relative h-[45vh] min-h-[280px] sm:h-[65vh] bg-cover bg-center"
        style={{ backgroundImage: "url('/clgimg1.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40 flex items-end">
          <HeroTitle />
        </div>
      </div>
    );
  }

  const slides = photos.length > 1 ? [...photos, photos[0]] : photos;
  const activeDot = index % photos.length;

  return (
    <div
      className="relative h-[45vh] min-h-[280px] sm:h-[65vh] overflow-hidden bg-slate-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Sliding track */}
      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${index * 100}%)`,
          transition: animate
            ? `transform ${SLIDE_MOVE_MS}ms ease-in-out`
            : "none",
        }}
      >
        {slides.map((photo, i) => (
          <div
            key={`${photo._id}-${i}`}
            className="relative h-full w-full shrink-0"
          >
            {/* Blurred copy fills the sides so the photo is never cropped */}
            <img
              src={photo.imageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-60"
            />

            <img
              src={photo.imageUrl}
              alt={`${photo.name} at ${photo.companyName}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="relative h-full w-full object-contain"
            />

            {/* Caption */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 sm:px-10 pt-16 pb-10">
              <p className="text-white text-lg sm:text-2xl font-bold capitalize">
                {photo.name?.toLowerCase()}
              </p>
              <p className="text-white/80 text-xs sm:text-sm">
                <span className="uppercase">{photo.department}</span>
                {photo.companyName && (
                  <span className="capitalize">
                    {" "}
                    • Internship at {photo.companyName.toLowerCase()}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Heading */}
      <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/60 to-transparent px-4 sm:px-10 pt-4 pb-10 pointer-events-none">
        <p className="text-white text-sm sm:text-lg font-semibold tracking-wide">
          Our Students at Internship
        </p>
      </div>

      {/* Dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
          {photos.map((photo, i) => (
            <button
              key={photo._id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === activeDot ? "w-6 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroTitle() {
  return (
    <div className="px-4 sm:px-10 pb-8">
      <h2 className="text-white text-2xl sm:text-4xl font-bold">
        Karnataka (Govt.) Polytechnic, Mangaluru
      </h2>
      <p className="text-white/80 text-sm sm:text-base mt-1">
        Internship Portal
      </p>
    </div>
  );
}
