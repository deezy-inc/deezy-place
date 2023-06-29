export default function (inscriborLink) {
  return [
    {
      id: 1,
      text: "Home",
      path: "/",
    },
    {
      id: 2,
      text: "Wallet",
      path: "/wallet",
      private: true,
    },
    {
      id: 3,
      text: "Inscriptions",
      path: "/inscriptions",
    },
    {
      id: 4,
      text: "Auctions",
      path: "/auction",
    },
    {
      id: 5,
      text: "Inscribe",
      path: inscriborLink,
    },
    {
      id: 6,
      text: "Sign",
      path: "/tools/sign",
    },
  ];
}
