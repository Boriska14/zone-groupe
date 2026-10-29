import Shell from "@/components/Shell";
import OrderStatus from "@/components/OrderStatus";

export default async function CommandePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Shell>
      <OrderStatus id={id} />
    </Shell>
  );
}
