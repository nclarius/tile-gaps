#!/bin/bash

# get plugin info
name=$(basename "$PWD")
version=$(grep -oP '(?<=X-KDE-PluginInfo-Version=).*' ./metadata.desktop)
echo "$name"' v'"$version"

# update version info in markdown format
sed -i "s/(v.*\..*)/(v$version)/g" README.md

# update version info in bbcode format
sed -i "s/(v.*\..*)/(v$version)/g" README.bbcode

# generate changelog in markdown format
heading_md=$([[ $version == *.0 ]] && echo '#' || echo '##')
caption_md="${heading_md}"' v'"${version}"
changes_md=$(cat CHANGELOG.txt)
changelog_md="$caption_md"$'\n'"$changes_md"$'\n\n'"$(cat CHANGELOG.md)"
if ! grep -Fxq "$caption_md" CHANGELOG.md
then
	echo "$changelog_md" > "CHANGELOG.md"
	echo 'generated changelog markdown'
fi

# generate changelog in bbcode format
heading_bb=$([[ $version == *.0 ]] && echo "h1" || echo "h2")
caption_bb='['"$heading_bb"']v'"$version"'[/'"$heading_bb"']'
changes_bb='[list]\n'"$(cat CHANGELOG.txt | sed 's/- /[*] /g')"$'\n[/list]'
changelog_bb="$caption_bb"$'\n'"$changes_bb"$'\n\n'"$(cat CHANGELOG.bbcode)"
if ! grep -Fxq "$caption_bb" CHANGELOG.bbcode
then
	echo "$changelog_bb" > "CHANGELOG.bbcode"
	echo 'generated changelog bbcode'
fi

# generate kwinscript package
find . -name "*.kwinscript" -type f -delete
zip -rq "${name}"'_v'"${version}"'.kwinscript'  \
	contents \
	metadata.desktop \
    install.sh \
    uninstall.sh \
    README.md \
    README.bbcode \
	CHANGELOG.md \
	CHANGELOG.bbcode \
	LICENSE
echo 'generated kwinscript package'

# commit changes to GitHub
git add .
git commit -q -m "$(paste -sd '; ' CHANGELOG.txt | sed 's/- / /g')"
git push -q
echo 'commited changes to git'

# generate GitHub release
gh release create "${name}"'_v'"${version}" -F CHANGELOG.txt "${name}"'_v'"${version}"'.kwinscript'
echo 'generated GitHub release'

echo 'done'
