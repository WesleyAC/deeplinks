with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "deeplinks";

  buildInputs = [
    pkgs.yarn
    pkgs.python3
    pkgs.firefox-bin
    pkgs.google-chrome-dev
  ];
}

