#!/bin/bash

# get plugin info
name=$(basename "$PWD")
version=$(grep -oP '"Version":\s*"[^"]*' ./metadata.json | grep -oP '[^"]*$')
package="${name}"'_v'"${version}"
echo "$package"

# generate kwinscript package
find . -name "*.kwinscript" -type f -delete
zip -rq "$package"'.kwinscript'  \
	contents \
	metadata.json \
    install.sh \
    uninstall.sh \
    README.md \
    README.bbcode \
	LICENSE
echo 'generated kwinscript package'

# commit changes to git
git add .
git commit -q -m "$(paste -sd '; ' CHANGELOG.txt | sed 's/- / /g')"
git push -q
echo 'commited changes to git'

# generate GitHub release
if [[ "$(gh release list -L 1)" == *"$package"* ]]; then
	gh release delete "$package" -y
fi
gh release create "$package" -t "$package" -F CHANGELOG.txt "$package"'.kwinscript'
echo 'generated GitHub release'

echo 'done'
