exports.Cluster = '172.23.121.84'
exports.RBACUser = "Administrator";
exports.RBACKPassword = "password";
exports.DefaultBucket = 'test_eventing'
exports.AuthPassword = ''
// exports.Buckets = ['server', 'sdk', 'mobile']
exports.Buckets = []
exports.httpListen = '127.0.0.1'
exports.httpPort = 8205
exports.CLAIM_MAP = {
    "git error": ["hudson.plugins.git.GitException", "python3: can't open file 'testrunner.py': [Errno 2] No such file or directory"],
    "SSH error": ["paramiko.ssh_exception.SSHException", "Exception SSH session not active occurred on"],
    "IPv6 test on IPv4 host": ["Cannot enable IPv6 on an IPv4 machine"],
    "Python SDK error (CBQE-6230)": ["ImportError: cannot import name 'N1QLQuery' from 'couchbase.n1ql'"],
    "Syntax error": ["KeyError:", "TypeError:"],
    "json.decoder.JSONDecodeError:": ["json.decoder.JSONDecodeError:"],
    "ServerUnavailableException: unable to reach the host": ["ServerUnavailableException: unable to reach the host"],
    "Node already added to cluster": ["ServerAlreadyJoinedException:"],
    "CBQ Error": ["membase.api.exception.CBQError:", "CBQError: CBQError:"],
    "RBAC error": ["Exception: {\"errors\":{\"roles\":\"Cannot assign roles to user because the following roles are unknown, malformed or role parameters are undefined: [security_admin]\"}}"],
    "Rebalance error": ["membase.api.exception.RebalanceFailedException"],
    "Build download failed": ["Unable to copy build to", "Unable to download build in"],
    "install not started": ["INSTALL NOT STARTED ON"],
    "install failed": ["INSTALL FAILED ON"],
    "No test report xml": ["No test report files were found. Configuration error?"]
}
