import Shell from "@/components/Shell";
import CartView from "@/components/CartView";

export default function PanierPage() {
  return (
    <Shell>
      <h1 className="text-2xl font-extrabold">Votre panier</h1>
      <CartView />
    </Shell>
  );
}
