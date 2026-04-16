{
  inputs = {
    # nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    nixpkgs.url = "github:NixOS/nixpkgs/3492680c7307336670aa778f4ff796459d4f24a6";
    systems.url = "github:nix-systems/default";
  };

  outputs = {
    systems,
    nixpkgs,
    ...
  } @ inputs: let
    eachSystem = f:
      nixpkgs.lib.genAttrs (import systems) (
        system:
          f nixpkgs.legacyPackages.${system}
      );
  in {
    devShells = eachSystem (pkgs: {
      default = pkgs.mkShell {
        buildInputs = [
          #pkgs.nodejs
          # You can set the major version of Node.js to a specific one instead
          # of the default version
          pkgs.nodejs_20

          # You can choose pnpm, yarn, or none (npm).
          #pkgs.nodePackages.pnpm
          pkgs.yarn-berry

          pkgs.nodePackages.typescript
          pkgs.nodePackages.typescript-language-server
          pkgs.edgedb
        ];
      };
    });
  };
}
