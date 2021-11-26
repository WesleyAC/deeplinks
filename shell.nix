with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "deeplinks";

  buildInputs = [
    pkgs.yarn
    pkgs.firefox-bin
    pkgs.google-chrome-dev
  ];
}

