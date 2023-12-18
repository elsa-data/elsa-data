FROM gitpod/workspace-full

RUN sudo mkdir -p /usr/local/share/keyrings && \
    sudo curl --proto '=https' --tlsv1.2 -sSf \
      -o /usr/local/share/keyrings/edgedb-keyring.gpg \
      https://packages.edgedb.com/keys/edgedb-keyring.gpg

RUN echo deb [signed-by=/usr/local/share/keyrings/edgedb-keyring.gpg]\
      https://packages.edgedb.com/apt \
      $(grep "VERSION_CODENAME=" /etc/os-release | cut -d= -f2) main \
      | sudo tee /etc/apt/sources.list.d/edgedb.list

RUN sudo apt-get update && sudo apt-get install -y edgedb-3
