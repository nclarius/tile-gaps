#/bin/bash

# get plugin info
name=$(basename "$PWD")
version=$(grep -oP '(?<=X-KDE-PluginInfo-Version=).*' metadata.desktop)
echo "$name v$version"

# generate changelog in markdown format
heading_md=$([[ $version == *.0 ]] && echo "#" || echo "##")
caption_md="${heading_md} v${version}"
changes_md=$(cat CHANGELOG.txt)
echo "$caption_md"$'\n'"$changes_md"$'\n\n'"$(cat CHANGELOG.md)" > "CHANGELOG.md"
echo "generated changelog.md"

# generate changelog in bbcode format
heading_bb=$([[ $version == *.0 ]] && echo "h1" || echo "h2")
caption_bb="[$heading_bb]v$version[/$heading_bb]"
changes_bb=$'[list]\n'"$(cat CHANGELOG.txt | sed "s/- /[*] /g")"$'\n[/list]'
echo "$caption_bb"$'\n'"$changes_bb"$'\n\n'"$(cat CHANGELOG.bbcode)" > "CHANGELOG.bbcode"
echo "generated changelog.bbcode"

# generate GitHub release
gh release create "${name}_v${version}" -F CHANGELOG.txt
echo "generated GitHub release"

# generate KDE store release
echo "generating GitHub release"
find . -name "*.kwinscript" -type f -delete
zip -rq "${name}_v${version}.kwinscript"  \
	contents \
    install.sh \
    uninstall.sh \
    README.md \
    README.bbcode \
	CHANGELOG.md \
	CHANGELOG.bbcode \
	LICENSE
echo "generated GitHub release"

# commit changes to GitHub
git add *
git commit -m "release $name v$version"
git push

echo "done"
