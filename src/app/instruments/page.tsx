"use client";
import { supabase } from "../../lib/supabaseClient";
import React, { useEffect, useState } from "react";

export default function Instruments() {
  type Instrument = {
    id: string;
    name: string;
    // Add other fields as needed
  };
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  useEffect(() => {
    const fetchInstruments = async () => {
      const { data } = await supabase.from("instruments").select();
      setInstruments(data ?? []);
    };
    fetchInstruments();
  }, []);
  return <pre>{JSON.stringify(instruments, null, 2)}</pre>;
}