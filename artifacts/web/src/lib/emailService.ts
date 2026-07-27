// EmailJS Configuration - THB Restaurant
// Service ID: service_mondeaw
// Public Key: FJt87t2iiXCKZrmox

const EMAILJS_SERVICE_ID = "service_mondeaw";
const EMAILJS_PUBLIC_KEY = "FJt87t2iiXCKZrmox";

// Template IDs
const EMAILJS_ORDER_TEMPLATE_ID = "template_6ela5dc";
const EMAILJS_DELIVERY_TEMPLATE_ID = "template_ahgve5v";

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  orderType: string;
  deliveryAddress?: string;
  specialInstructions?: string;
}

export async function sendOrderConfirmation(orderData: OrderEmailData): Promise<boolean> {
  try {
    const itemsList = orderData.items
      .map((item) => `${item.name} x${item.quantity} - Rs ${item.price}`)
      .join("\n");

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_ORDER_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: "zorozora695@gmail.com",
          order_id: orderData.orderId,
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          items_list: itemsList,
          total: "Rs " + orderData.total.toLocaleString(),
          order_type: orderData.orderType === "delivery" ? "Delivery" : "Takeaway",
          delivery_address: orderData.deliveryAddress || "N/A",
          special_instructions: orderData.specialInstructions || "None",
          time: new Date().toLocaleString(),
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send order email:", error);
    return false;
  }
}

export async function sendDeliveryUpdate(
  phone: string,
  orderId: string,
  status: string
): Promise<boolean> {
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_DELIVERY_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: "zorozora695@gmail.com",
          order_id: orderId,
          status: status,
          time: new Date().toLocaleString(),
        },
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
