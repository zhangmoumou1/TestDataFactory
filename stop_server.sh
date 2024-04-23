#!/bin/bash
function print_line() {
  for i in {1..5}
  do
    echo -ne "----------"
    sleep 1
  done
}

print_line
echo -ne "\n"
echo "ps -ef | grep 0:8088 | grep -v grep | awk '{print $2}' | xargs kill"
ps -ef | grep 0:8088 | grep -v grep | awk '{print $2}' | xargs kill

echo -ne "\n"
print_line
echo -ne "\n"
echo "ps -ef | grep 0:8088 | grep -v grep result is:"
ps -ef | grep 0:8088 | grep -v grep
