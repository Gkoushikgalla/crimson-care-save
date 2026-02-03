import { useState, useEffect, useCallback } from "react";

const bloodDonationQuotes = [
  "Every drop of blood donated is a drop of hope for someone in need.",
  "Be the reason someone smiles today. Donate blood, save a life.",
  "Your blood type doesn't define who you can love, but it can save lives.",
  "The blood you donate gives someone another chance at life.",
  "A single pint of blood can save up to three lives.",
  "Heroes don't always wear capes. Sometimes they just donate blood.",
  "Donating blood costs nothing but can mean everything to someone.",
  "Be a lifeline. Donate blood today.",
  "Blood donation is the gift of life. Give generously.",
  "Your blood is replaceable. A life is not.",
  "One donation can save multiple lives. Be someone's hero.",
  "Blood donors are life savers in the truest sense.",
  "The need for blood is constant. The gratitude is eternal.",
  "Give blood, give life, give hope.",
  "A few minutes of your time can give someone a lifetime.",
  "Blood is meant to circulate. Pass it around.",
  "Donate blood because you never know when you might need it.",
  "Be the miracle someone is waiting for.",
  "Your donation today is someone's survival tomorrow.",
  "Blood connects us all. Donate and strengthen that bond.",
];

export const useBloodDonationQuotes = (intervalMs: number = 4000) => {
  const [currentQuote, setCurrentQuote] = useState(() => 
    bloodDonationQuotes[Math.floor(Math.random() * bloodDonationQuotes.length)]
  );
  const [quoteIndex, setQuoteIndex] = useState(0);

  const getRandomQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * bloodDonationQuotes.length);
    setCurrentQuote(bloodDonationQuotes[randomIndex]);
    setQuoteIndex(randomIndex);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getRandomQuote();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, getRandomQuote]);

  return { currentQuote, quoteIndex, getRandomQuote, totalQuotes: bloodDonationQuotes.length };
};

export const getRandomQuote = () => {
  return bloodDonationQuotes[Math.floor(Math.random() * bloodDonationQuotes.length)];
};

export default bloodDonationQuotes;
