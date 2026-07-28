import { schoolConfig } from "@/lib/school-config";

export function ContactCTA() {
  return (
    <section id="contact" className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h2 className="text-2xl font-semibold">Contact us</h2>
      <p className="mt-2 text-muted-foreground">
        Interested in enrolling your child? Reach out and our office will get back to you.
      </p>
      <dl className="mt-6 space-y-1 text-sm">
        <div>
          <dt className="inline font-medium">Address: </dt>
          <dd className="inline text-muted-foreground">{schoolConfig.contact.address}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Phone: </dt>
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
