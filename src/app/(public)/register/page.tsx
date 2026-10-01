import Image from "next/image";

import { RegistrationForm } from "@/components/forms/registration-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logo from "@/app/logo.png";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 py-10">
      <Card className="w-full max-w-4xl">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-foreground/10">
            <Image src={logo} alt="Madani Islamic School" className="h-full w-full object-contain" />
          </div>
          <CardTitle>Formulir Pendaftaran Peserta Didik</CardTitle>
          <CardDescription>
            Isi data sesuai dokumen resmi (KTP/KK/Akta Lahir). Pihak sekolah akan meninjau pendaftaran ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}
