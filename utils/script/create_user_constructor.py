#!/usr/bin/env python
# -*- coding:utf-8 -*-

# *********************************************************#
# @@Author: 张某某
# @@Create Date: 20xx年xx月xx日
# @@Modify Date: 20xx年xx月xx日
# @@Description: 创建用户
# *********************************************************#

from utils.public.log import Log

class CreateUser(object):
    """
    创建用户
    """

    @staticmethod
    def user(user_name, env, is_marital, birthdate, weight, sex, personality_label, interest='无', motto='无'):
        """
        本功能无具体业务，只是个模板例子
        """
        try:
            info = f'用户名：{user_name}，\n' \
                   f'执行环境：{env}，\n' \
                   f'婚姻状况：{is_marital}，\n' \
                   f'出生日期：{birthdate}，\n' \
                   f'年龄：{weight}，\n' \
                   f'性别：{sex}，\n' \
                   f'个性标签：{personality_label}，\n' \
                   f'爱好：{interest}，\n' \
                   f'座右铭：{motto}'
            result = f'创建用户成功：\n' \
                     f'{info}'
        except Exception as e:
            result = f'创建用户失败，{e}'
        finally:
            Log().info(result)
            return result


if __name__ == "__main__":
    CreateUser.user()