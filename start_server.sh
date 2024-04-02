#!/bin/bash
function print_line() {
  for i in {1..5}
  do
    echo -ne "----------"
    sleep 1
  done
}

echo -ne "\n"
print_line
echo -ne "\n"
#chmod 755 *
python3 manage.py makemigrations
python3 manage.py migrate
echo -ne "数据库迁移成功，启动服务成功"
nohup python3 manage.py runserver 0:8088 >> server.out 2>&1 &
echo -ne "\n"
print_line
echo -ne "\n"
echo "success"
