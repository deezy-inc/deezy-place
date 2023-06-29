export default function (inscriborLink) {
  return [
    {
      id: 1,
      text: "Home",
      path: "/",
    },
    {
      id: 1,
      text: "Wallet",
      path: "/wallet",
      private: true,
    },
    {
      id: 2,
      text: "Inscriptions",
      path: "/inscriptions",
    },
    {
      id: 3,
      text: "Auctions",
      path: "/auction",
    },
    {
      id: 4,
      text: "Inscribe",
      path: inscriborLink,
    },
    {
      id: 5,
      text: "Sign",
      path: "/tools/sign",
    },
  ];
}
