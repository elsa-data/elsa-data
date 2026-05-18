{
  inputs = {
    # nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-25.11-darwin";
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
          f (import nixpkgs {
            inherit system;
            config.allowUnfree = true;
          })
      );
  in {
    devShells = eachSystem (pkgs: {
      default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs_20

          pkgs.typescript
          pkgs.typescript-language-server
          # pkgs.edgedb
          pkgs.k3d
          pkgs.bun
          pkgs.gel
          # Alias and shell hook are just for running gel in docker if required
          # (pkgs.writeShellScriptBin "gel" ''
           # exec docker run --rm -i --entrypoint gel --network host -v $(pwd):/app -w /app geldata/gel:7 --dsn gel://admin:development@localhost:5656 --tls-security insecure "$@"
          # '')
        ];

        # shellHook = ''
        #   export GEL_DSN="gel://admin:development@localhost:5656"
        #   export GEL_CLIENT_TLS_SECURITY="insecure"
        # '';
      };
    });
  };
}
