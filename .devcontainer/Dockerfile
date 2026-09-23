FROM node:22-bookworm-slim

# Remotion version baked into the image. Must match templates/*/package.json
# and every client project. Change it only via scripts/upgrade.sh, then rebuild.
ARG REMOTION_VERSION=4.0.526

# Chrome Headless Shell dependencies required by Remotion, emoji fonts,
# system ffmpeg for the audio pipeline (mixing, ducking), build tools, git.
RUN apt-get update && apt-get install -y --no-install-recommends \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0 \
  libgbm-dev \
  libasound2 \
  libxrandr2 \
  libxkbcommon-dev \
  libxfixes3 \
  libxcomposite1 \
  libxdamage1 \
  libatk-bridge2.0-0 \
  libpango-1.0-0 \
  libcairo2 \
  libcups2 \
  fonts-noto-color-emoji \
  ffmpeg \
  git \
  curl \
  ca-certificates \
  sudo \
  build-essential \
  cmake \
  && rm -rf /var/lib/apt/lists/*

# Passwordless sudo for the container user (postCreateCommand uses it to fix
# volume ownership). Pre-create ~/.claude owned by node: a named volume that is
# first mounted onto an existing directory inherits that directory's ownership.
# Without this Docker creates the mount point root-owned and Claude Code cannot
# save its login credentials (EACCES, shown as a login/400 error in VS Code).
RUN echo "node ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/node \
  && chmod 0440 /etc/sudoers.d/node \
  && mkdir -p /home/node/.claude \
  && chown -R node:node /home/node/.claude

# Remotion CLI at the pinned version, then pre-download the matching
# Chrome Headless Shell so no render ever fetches it.
#
# Remotion caches the browser per project: it walks up from the cwd to the
# nearest package.json and uses <that>/node_modules/.remotion, falling back to
# <cwd>/.remotion when there is none. A plain `browser ensure` at build time
# therefore lands in a directory no render ever looks at, and every project
# downloads its own 220 MB copy. We pin one shared copy via REMOTION_CHROME,
# which every remotion.config.ts feeds to Config.setBrowserExecutable().
ENV REMOTION_CHROME=/opt/remotion-browser/.remotion/chrome-headless-shell/linux64/chrome-headless-shell-linux64/chrome-headless-shell

RUN npm install -g @remotion/cli@${REMOTION_VERSION} \
  && mkdir -p /opt/remotion-browser \
  && cd /opt/remotion-browser \
  && npx remotion browser ensure \
  && chmod -R a+rX /opt/remotion-browser \
  && test -x "$REMOTION_CHROME"

# Piper: free, local text-to-speech (MIT), single static binary plus voices, so
# a voiceover renders with no API key. Voices are listed in
# assets/voices/piper-voices.txt; add a line and rebuild to add one.
# The slim image has no ca-certificates, without which curl cannot fetch
# anything over HTTPS (installed above).
ENV PIPER_BIN=/opt/piper/piper
ENV PIPER_VOICES=/opt/piper/voices
COPY assets/voices/piper-voices.txt /tmp/piper-voices.txt
RUN mkdir -p /opt/piper/voices \
  && curl -sL https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz \
     | tar -xz -C /opt/piper --strip-components=1 \
  && grep -vE "^\s*(#|$)" /tmp/piper-voices.txt | while read -r v; do \
       n="$(basename "$v")"; \
       curl -sL -o "/opt/piper/voices/$n.onnx"      "https://huggingface.co/rhasspy/piper-voices/resolve/main/$v.onnx"; \
       curl -sL -o "/opt/piper/voices/$n.onnx.json" "https://huggingface.co/rhasspy/piper-voices/resolve/main/$v.onnx.json"; \
     done \
  && chmod -R a+rX /opt/piper \
  && echo "Test." | /opt/piper/piper --model "/opt/piper/voices/$(basename "$(grep -vE '^\s*(#|$)' /tmp/piper-voices.txt | head -1)").onnx" --output_file /tmp/piper-test.wav \
  && rm -f /tmp/piper-test.wav /tmp/piper-voices.txt
