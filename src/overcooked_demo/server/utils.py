import os
from threading import Lock

# A constant for the data directory used by Docker
DOCKER_VOLUME = "/app/data"


class ThreadSafeSet(set):
    """
    A set with a Lock so that multiple threads can safely add/remove without concurrency issues.
    """
    def __init__(self, *args, **kwargs):
        super(ThreadSafeSet, self).__init__(*args, **kwargs)
        self.lock = Lock()

    def add(self, *args):
        with self.lock:
            retval = super(ThreadSafeSet, self).add(*args)
        return retval

    def clear(self, *args):
        with self.lock:
            retval = super(ThreadSafeSet, self).clear(*args)
        return retval

    def pop(self, *args):
        with self.lock:
            if len(self):
                retval = super(ThreadSafeSet, self).pop(*args)
            else:
                retval = None
        return retval

    def remove(self, item):
        with self.lock:
            if item in self:
                retval = super(ThreadSafeSet, self).remove(item)
            else:
                retval = None
        return retval


class ThreadSafeDict(dict):
    """
    A dictionary with a Lock for concurrency safety.
    """
    def __init__(self, *args, **kwargs):
        super(ThreadSafeDict, self).__init__(*args, **kwargs)
        self.lock = Lock()

    def clear(self, *args, **kwargs):
        with self.lock:
            retval = super(ThreadSafeDict, self).clear(*args, **kwargs)
        return retval

    def pop(self, *args, **kwargs):
        with self.lock:
            retval = super(ThreadSafeDict, self).pop(*args, **kwargs)
        return retval

    def __setitem__(self, *args, **kwargs):
        with self.lock:
            retval = super(ThreadSafeDict, self).__setitem__(*args, **kwargs)
        return retval

    def __delitem__(self, item):
        with self.lock:
            if item in self:
                retval = super(ThreadSafeDict, self).__delitem__(item)
            else:
                retval = None
        return retval


def create_dirs(config: dict, cur_layout: str):
    """
    Utility for OvercookedGame data collection:
      - We build a directory path: DOCKER_VOLUME/cur_layout/[old|new]_dynamics/type/time/
      - e.g. /app/data/you_shall_not_pass/New/HA/2025-02-27_18-33-12
    """
    path = os.path.join(
        DOCKER_VOLUME,
        cur_layout,
        config["old_dynamics"],
        config["type"],
        config["time"],
    )
    if not os.path.exists(path):
        os.makedirs(path)
    return path
