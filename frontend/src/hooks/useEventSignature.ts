import { useSignTypedData, useAccount, useChainId } from "wagmi";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface EventConnectData {
  eventName: string;
  eventDate: number; // timestamp
  location: string;
  eventId: string;
  nftContract: string;
  userAddress: string;
  timestamp: number;
}

/**
 * Hook để sign EIP-712 typed data khi kết nối với một sự kiện cụ thể
 * Giúp MetaMask hiển thị rõ ràng thông tin sự kiện người dùng đang tương tác
 */
export function useEventSignature() {
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();
  const chainId = useChainId();

  return useMutation({
    mutationFn: async (eventData: EventConnectData) => {
      if (!address) {
        throw new Error("Vui lòng kết nối ví trước");
      }

      // EIP-712 Domain
      const domain = {
        name: "Festival Ticket Marketplace",
        version: "1.0",
        chainId: chainId,
        verifyingContract: eventData.nftContract as `0x${string}`,
      };

      // EIP-712 Types
      const types = {
        EventConnect: [
          { name: "eventName", type: "string" },
          { name: "eventId", type: "string" },
          { name: "location", type: "string" },
          { name: "eventDate", type: "uint256" },
          { name: "userAddress", type: "address" },
          { name: "timestamp", type: "uint256" },
        ],
      };

      // Message data
      const message = {
        eventName: eventData.eventName,
        eventId: eventData.eventId,
        location: eventData.location,
        eventDate: BigInt(eventData.eventDate),
        userAddress: address as `0x${string}`,
        timestamp: BigInt(eventData.timestamp),
      };

      console.log("🔐 Signing EIP-712 typed data:", {
        domain,
        types,
        message,
      });

      toast.loading("Vui lòng ký xác nhận trong MetaMask...");

      try {
        const signature = await signTypedDataAsync({
          domain,
          types,
          primaryType: "EventConnect",
          message,
        });

        toast.dismiss();
        toast.success(`✅ Đã kết nối với sự kiện: ${eventData.eventName}`);

        return {
          signature,
          message,
          domain,
        };
      } catch (error: any) {
        toast.dismiss();
        if (error?.message?.includes("User rejected")) {
          throw new Error("Bạn đã từ chối ký xác nhận");
        }
        throw error;
      }
    },
    onError: (error: any) => {
      console.error("❌ Error signing event connection:", error);
      const message = error?.message || "Không thể xác nhận kết nối";
      toast.error(message);
    },
  });
}

/**
 * Hook để sign EIP-712 typed data khi mua vé
 * Hiển thị đầy đủ thông tin vé trong MetaMask
 */
export function useTicketPurchaseSignature() {
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();
  const chainId = useChainId();

  return useMutation({
    mutationFn: async ({
      eventName,
      eventId,
      ticketType,
      price,
      location,
      eventDate,
      nftContract,
    }: {
      eventName: string;
      eventId: string;
      ticketType: string;
      price: string;
      location: string;
      eventDate: number;
      nftContract: string;
    }) => {
      if (!address) {
        throw new Error("Vui lòng kết nối ví trước");
      }

      // EIP-712 Domain
      const domain = {
        name: "Festival Ticket Purchase",
        version: "1.0",
        chainId: chainId,
        verifyingContract: nftContract as `0x${string}`,
      };

      // EIP-712 Types
      const types = {
        TicketPurchase: [
          { name: "eventName", type: "string" },
          { name: "eventId", type: "string" },
          { name: "ticketType", type: "string" },
          { name: "price", type: "string" },
          { name: "location", type: "string" },
          { name: "eventDate", type: "uint256" },
          { name: "buyer", type: "address" },
          { name: "timestamp", type: "uint256" },
        ],
      };

      // Message data
      const message = {
        eventName,
        eventId,
        ticketType,
        price: `${price} FEST`,
        location,
        eventDate: BigInt(eventDate),
        buyer: address as `0x${string}`,
        timestamp: BigInt(Date.now()),
      };

      console.log("🎫 Signing ticket purchase with EIP-712:", {
        domain,
        types,
        message,
      });

      toast.loading(
        `Vui lòng xác nhận mua vé ${ticketType} cho sự kiện "${eventName}"...`
      );

      try {
        const signature = await signTypedDataAsync({
          domain,
          types,
          primaryType: "TicketPurchase",
          message,
        });

        toast.dismiss();
        return {
          signature,
          message,
          domain,
        };
      } catch (error: any) {
        toast.dismiss();
        if (error?.message?.includes("User rejected")) {
          throw new Error("Bạn đã từ chối mua vé");
        }
        throw error;
      }
    },
    onError: (error: any) => {
      console.error("❌ Error signing ticket purchase:", error);
      const message = error?.message || "Không thể xác nhận mua vé";
      toast.error(message);
    },
  });
}
