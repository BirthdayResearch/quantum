pragma solidity 0.8.18;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract TestToken is ERC20 {
    uint8 internal decimal;
    constructor(string memory a, string memory b, uint8 _decimal) ERC20(a, b) {
        decimal = _decimal;
    }

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return decimal;
    }

}
