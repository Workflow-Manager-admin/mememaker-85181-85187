#!/bin/bash
cd /home/kavia/workspace/code-generation/mememaker-85181-85187/main_container_for_mememaker
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

