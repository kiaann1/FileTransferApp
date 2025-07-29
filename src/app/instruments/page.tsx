"use client";
import { supabase } from "../../lib/supabaseClient";
import React, { useEffect, useState } from "react";

export default function Instruments() {
  const [instruments, setInstruments] = useState<any[]>([]);
  useEffect(() => {
    const fetchInstruments = async () => {
      const { data } = await supabase.from("instruments").select();
      setInstruments(data ?? []);
    };
    fetchInstruments();
  }, []);
  return <pre>{JSON.stringify(instruments, null, 2)}</pre>;
}