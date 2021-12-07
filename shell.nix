with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "deeplinks";

  buildInputs = [
    pkgs.yarn
    pkgs.nodejs
    pkgs.python3
    pkgs.firefox-bin
    pkgs.google-chrome-dev
    pkgs.gzip
    pkgs.brotli
    pkgs.zip
  ];
}

