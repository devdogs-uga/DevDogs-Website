"use client";

import { useEffect, useState } from "react";
import FormButton from "~/components/FormButton";
import Input from "~/components/Input";

const STORAGE_KEY = "devdogs:localServerUrl";

export default function LocalServerUrlField() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="flex max-w-md gap-1.5">
      <Input
        mono
        className="text-sm"
        name="localServerUrl"
        type="url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="http://localhost:3000/webhooks/devdogs"
      />
      <FormButton theme="black" type="submit" className="text-sm text-nowrap">
        {saved ? "Saved!" : "Save"}
      </FormButton>
    </form>
  );
}
