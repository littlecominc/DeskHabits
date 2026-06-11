import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId);
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'inactive';
      await supabase
        .from('profiles')
        .update({ subscription_status: status })
        .eq('stripe_customer_id', subscription.customer as string);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
