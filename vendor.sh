#!/usr/bin/env bash
set -ex
wget -e use_proxy=yes -e https_proxy=http://localhost:7890 -P vendors $1
