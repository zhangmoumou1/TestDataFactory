#!/usr/bin/env python
# -*- coding:utf-8 -*-

# *********************************************************#
# @@Author: 张某某
# @@Create Date: 20xx年xx月xx日
# @@Modify Date: 20xx年xx月xx日
# @@Description: 创建用户回滚
# *********************************************************#

from utils.public.log import Log

class RollbackCreateUser(object):
    """
    回滚创建用户
    """

    @staticmethod
    def rollback_user(id, env, user_name):
        """
        本功能无具体业务，只是个模板例子
        """
        try:
            Log().info(id)
            Log().info(env)
            Log().info(user_name)
            info = f'记录ID：{id}，\n' \
                   f'执行环境：{env}，\n' \
                   f'用户名：{user_name}'
            result = f'回滚成功\n' \
                     f'{info}'
        except Exception as e:
            result = f'回滚记录ID={id}失败\n' \
                     f'{e}'
        finally:
            Log().info(result)
            return result


if __name__ == "__main__":
    RollbackCreateUser.rollback_user()