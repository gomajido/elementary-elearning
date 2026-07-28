import { schoolConfig } from "@/lib/school-config";

export function ContactCTA() {
  return (
    <section id="contact" className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold">Hubungi Kami</h2>
      <p className="mt-2 text-muted-foreground">
        Tertarik mendaftarkan putra/putri Anda? Hubungi kami dan pihak sekolah akan segera merespons.
      </p>
      <dl className="mt-6 space-y-1 text-sm">
        <div>
          <dt className="inline font-medium">Alamat: </dt>
          <dd className="inline text-muted-foreground">{schoolConfig.contact.address}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Telepon: </dt>
          <dd className="inline text-muted-foreground">{schoolConfig.contact.phone}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Email: </dt>
          <dd className="inline text-muted-foreground">{schoolConfig.contact.email}</dd>
        </div>
      </dl>
    </section>
  );
}
