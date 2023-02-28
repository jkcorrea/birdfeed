#!/usr/bin/env bash

# Twint is accidentally rejecting later python versions, so we're just commenting that out
# https://github.com/twintproject/twint/issues/1346

twint_path=$(python -c "import twint; print(twint.__path__[0])")
script_dir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
patch -b -u "${twint_path}/cli.py" -i "${script_dir}/twint-cli.patch"
